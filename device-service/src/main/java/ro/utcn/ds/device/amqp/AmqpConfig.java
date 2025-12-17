package ro.utcn.ds.device.amqp;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Declarables;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.DefaultClassMapper;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class AmqpConfig {
    public static final String SYNC_EXCHANGE = "ems.sync";
    public static final String SYNC_QUEUE = "device.sync";

    @Bean
    TopicExchange syncExchange() {
        return new TopicExchange(SYNC_EXCHANGE, true, false);
    }

    @Bean
    Queue syncQueue() {
        return QueueBuilder.durable(SYNC_QUEUE).build();
    }

    @Bean
    Declarables syncBindings(Queue syncQueue, TopicExchange syncExchange) {
        Binding userDeleted = BindingBuilder.bind(syncQueue)
                .to(syncExchange)
                .with("user.deleted");
        Binding userCreated = BindingBuilder.bind(syncQueue)
                .to(syncExchange)
                .with("user.created");
        return new Declarables(userDeleted, userCreated);
    }

    @Bean
    MessageConverter messageConverter(ObjectMapper objectMapper) {
        Jackson2JsonMessageConverter converter = new Jackson2JsonMessageConverter(objectMapper);
        DefaultClassMapper classMapper = new DefaultClassMapper();
        classMapper.setTrustedPackages("*");
        Map<String, Class<?>> idMapping = new HashMap<>();
        idMapping.put("ro.utcn.ds.users.amqp.UserCreatedEvent", UserCreatedEvent.class);
        idMapping.put("ro.utcn.ds.users.amqp.UserDeletedEvent", UserDeletedEvent.class);
        classMapper.setIdClassMapping(idMapping);
        converter.setClassMapper(classMapper);
        converter.setAlwaysConvertToInferredType(true);
        return converter;
    }
}
